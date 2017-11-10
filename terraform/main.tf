# lambda function that proceses incoming webhooks from github, verifies signature
# and publishes to sns
resource "aws_lambda_function" "codebuild_sns_slack" {
  function_name = "${var.name}"
  description   = "update github status via codebuild events"
  role          = "${aws_iam_role.codebuild_sns_slack.arn}"
  handler       = "index.handler"
  memory_size   = "${var.memory_size}"
  timeout       = "${var.timeout}"
  runtime       = "nodejs6.10"
  s3_bucket     = "${var.s3_bucket}"
  s3_key        = "${var.s3_key}"

  environment {
    variables = {
      "CONFIG_PARAMETER_NAMES" = "${join(",", compact(list("${var.config_parameter_name}", "${var.additional_parameter_names}")))}"
      "DEBUG"                  = "${var.debug}"
      "NODE_ENV"               = "${var.node_env}"
    }
  }
}

# define terraform managed configuration
resource "aws_ssm_parameter" "configuration" {
  name      = "${var.config_parameter_name}"
  type      = "SecureString"
  value     = "${data.template_file.configuration.rendered}"
  overwrite = true
}

data "template_file" "configuration" {
  template = "${file("${path.module}/configuration.json")}"

  vars {
    sns_topic_arn = "${aws_sns_topic.codebuild_sns_slack.arn}"
  }
}

# subscribe lambda function to gibhub webhook sns topic
resource "aws_sns_topic_subscription" "codebuild_sns_slack" {
  topic_arn = "${aws_sns_topic.codebuild_sns_slack.arn}"
  protocol  = "lambda"
  endpoint  = "${aws_lambda_function.codebuild_sns_slack.arn}"
}

# allow sns to invoke trigger function
resource "aws_lambda_permission" "codebuild_sns_slack" {
  statement_id  = "AllowExecutionFromSNS-${var.name}"
  action        = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.codebuild_sns_slack.function_name}"
  principal     = "sns.amazonaws.com"
  source_arn    = "${aws_sns_topic.codebuild_sns_slack.arn}"
}

# include cloudwatch log group resource definition in order to ensure it is
# removed with function removal
resource "aws_cloudwatch_log_group" "codebuild_sns_slack" {
  name = "/aws/lambda/${var.name}"
}

# iam role for publish lambda function
resource "aws_iam_role" "codebuild_sns_slack" {
  name               = "${var.name}"
  assume_role_policy = "${data.aws_iam_policy_document.assume_role.json}"
}

data "aws_iam_policy_document" "assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    effect  = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

# iam policy for lambda function allowing it to trigger builds for all
# codebuild projects
resource "aws_iam_policy" "codebuild_sns_slack" {
  name   = "${var.name}"
  policy = "${data.aws_iam_policy_document.codebuild_sns_slack.json}"
}

data "aws_iam_policy_document" "codebuild_sns_slack" {
  # allow function to pull configuration from ssm
  statement {
    actions = [
      "ssm:GetParameter",
      "ssm:GetParameters",
    ]

    effect = "Allow"

    resources = [
      "${formatlist("arn:aws:ssm:${var.region}:${data.aws_caller_identity.current.account_id}:parameter%s", split(",", "${var.config_parameter_name},${var.additional_parameter_names}"))}",
    ]
  }

  # allow function to manage cloudwatch logs
  statement {
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    effect    = "Allow"
    resources = ["*"]
  }
}

# attach trigger policy to trigger role
resource "aws_iam_policy_attachment" "codebuild_sns_slack" {
  name       = "${var.name}"
  roles      = ["${aws_iam_role.codebuild_sns_slack.name}"]
  policy_arn = "${aws_iam_policy.codebuild_sns_slack.arn}"
}
