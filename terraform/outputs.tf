output "sns_topic_arn" {
  value = "${aws_sns_topic.codebuild_sns_slack.arn}"
}
