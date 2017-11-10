# define an sns topic for codebuild notifications
resource "aws_sns_topic" "codebuild_sns_slack" {
  name = "${var.name}-builds"
}

# define policy for sns topic that allows cloudwatch to publish events
resource "aws_sns_topic_policy" "codebuild_sns_slack" {
  arn    = "${aws_sns_topic.codebuild_sns_slack.arn}"
  policy = "${data.aws_iam_policy_document.codebuild_sns_slack_sns.json}"
}

data "aws_iam_policy_document" "codebuild_sns_slack_sns" {
  # allow cloudwatch to publish to SNS
  statement {
    actions = [
      "sns:Publish",
    ]

    effect = "Allow"

    resources = [
      "${aws_sns_topic.codebuild_sns_slack.arn}",
    ]

    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

# define a cloudwatch event that captures all codebuild build state changes
resource "aws_cloudwatch_event_rule" "codebuild_sns_slack_state" {
  name          = "${var.name}-build-state"
  description   = "send codebuild build state changes to SNS"
  event_pattern = "${file("${path.module}/event-state-change.json")}"
}

# connect above event rule with above sns topic
resource "aws_cloudwatch_event_target" "codebuild_sns_slack_state" {
  rule  = "${aws_cloudwatch_event_rule.codebuild_sns_slack_state.name}"
  arn   = "${aws_sns_topic.codebuild_sns_slack.arn}"
  input = ""
}

# define a cloudwatch event that captures all codebuild build state changes
resource "aws_cloudwatch_event_rule" "codebuild_sns_slack_phase" {
  name          = "${var.name}-build-phase"
  description   = "send codebuild build state changes to SNS"
  event_pattern = "${file("${path.module}/event-phase-change.json")}"
}

# connect above event rule with above sns topic
resource "aws_cloudwatch_event_target" "codebuild_sns_slack_phase" {
  rule  = "${aws_cloudwatch_event_rule.codebuild_sns_slack_phase.name}"
  arn   = "${aws_sns_topic.codebuild_sns_slack.arn}"
  input = ""
}
