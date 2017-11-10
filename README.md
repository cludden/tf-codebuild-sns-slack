# tf-codebuild-sns-slack
a `node.js` lambda function that forwards `CodeBuild` events to `Slack` via `SNS`

<p align="center">
<img src="./architecture.png" align="center" alt="architecture diagram" />
</p>

## Installing
```shell
# clone the repo and install dependencies
$ git clone git@github.com:cludden/tf-codebuild-sns-slack.git
```

## Contributing
1. Clone it (`git clone git@github.com:cludden/tf-codebuild-sns-slack.git`)
1. Create your feature branch (`git checkout -b my-new-feature`)
1. Commit your changes using [conventional changelog standards](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md) (`git commit -m 'feat(my-new-feature): Add some feature'`)
1. Push to the branch (`git push origin my-new-feature`)
1. Ensure linting/security/tests are all passing
1. Create new Pull Request

## Testing
Prerequisites:
- [Docker & Compose](https://store.docker.com/search?offering=community&type=edition))

```shell
# run test suite and generate code coverage
$ docker-compose run tf-codebuild-sns-slack

# run linter
$ docker-compose run tf-codebuild-sns-slack npm run lint

# run security scan
$ docker-compose run tf-codebuild-sns-slack npm run sec
```

## Building
```
$ docker-compose run tf-codebuild-sns-slack
```

## Releasing
1. Merge fixes & features to master
1. Run lint check `npm run lint`
1. Run security check `npm run sec`
1. Run full test suite `docker-compose run tf-codebuild-sns-slack`
1. Run release script `npm run release`
1. Push release & release tag to github `git push --follow-tags`
1. [Publish new release](https://help.github.com/articles/creating-releases/) in github, using the release notes from the [CHANGELOG](./CHANGELOG)

## Configuring
Define custom configuration
```json
{
  "slack": {
    "webhookUrl": "xxxx"
  },
  "log": {
    "level": "info"
  }
}
```

Add JSON configuration to ssm
```shell
$ aws ssm put-parameter --name /secrets/codebuild-trigger/custom --type SecureString --value $JSONCONFIG
```

## Deploying
Via terraform
```
module "codebuild_trigger" {
  source                     = "git::git@github.com:cludden/tf-codebuild-sns-slack.git//terraform?ref={version}"
  config_parameter_name      = "/secrets/codebuild-sns-slack"
  debug                      = ""
  memory_size                = 128
  name                       = "codebuild-sns-slack"
  node_env                   = "production"
  region                     = "us-west-2"
  s3_bucket                  = "my-artifact-bucket"
  s3_key                     = "tf-codebuild-sns-slack/${var.version}/index.zip"
  timeout                    = 10
}
```

## License
Licensed under the [MIT License](LICENSE.md)

Copyright (c) 2017 Chris Ludden
