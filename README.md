<h1 align="center">
  <br>
  Pion Template
  <br>
</h1>
<h4 align="center">Template for new Pion repositoies</h4>
<p align="center">
  <a href="https://pion.ly"><img src="https://img.shields.io/badge/pion-template-gray.svg?longCache=true&colorB=brightgreen" alt="Pion template"></a>
  <a href="https://discord.gg/PngbdqpFbt"><img src="https://img.shields.io/badge/join-us%20on%20discord-gray.svg?longCache=true&logo=discord&colorB=brightblue" alt="join us on Discord"></a> <a href="https://bsky.app/profile/pion.ly"><img src="https://img.shields.io/badge/follow-us%20on%20bluesky-gray.svg?longCache=true&logo=bluesky&colorB=brightblue" alt="Follow us on Bluesky"></a>  <br>
  <img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/pion/template/test.yaml">
  <a href="https://pkg.go.dev/github.com/pion/template"><img src="https://pkg.go.dev/badge/github.com/pion/template.svg" alt="Go Reference"></a>
  <a href="https://codecov.io/gh/pion/template"><img src="https://codecov.io/gh/pion/template/branch/master/graph/badge.svg" alt="Coverage Status"></a>
  <a href="https://goreportcard.com/report/github.com/pion/template"><img src="https://goreportcard.com/badge/github.com/pion/template" alt="Go Report Card"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
</p>
<br>

This repo is a template for starting new Pion-related Git repositories.

### Steps for creating a new repo

1. Search and replace any occurrence of `template` in this repo.
2. Add the repo to the [pion/.goassets sync workflow](https://github.com/pion/.goassets/blob/master/.github/workflows/assets-sync.yml#L15)
3. Update README
4. Update the repository details:
    - Tags: at least "go", "golang", "pion", ...
    - Description: _same as in README_
    - URL: https://pion.ly/
    - Disable features "Environments", "Packages"
5. Please make sure the repo has consistent GitHub settings with the other Pion repos:
    - Disable features "Wiki", "Projects", "Discussions", "Sponsorships"
    - Enable feature "Preserve this repository"
    - Only allow rebase merging. Disable squash and merge commits.
    - Enable option "Always suggest updating pull request branches"
    - Enable option "Automatically delete head branches"
    - Make sure the [master branch is protected](https://github.com/pion/template/settings/branch_protection_rules):
        - Enable "Require a pull request before merging"
            - Enable "Require approvals"
            - Set "Require number of approvals before merging" to 1
        - Enable "Require status checks to pass before merging"
        - Enable "Require linear history"

### Roadmap
The library is used as a part of our WebRTC implementation. Please refer to that [roadmap](https://github.com/pion/webrtc/issues/9) to track our major milestones.

### Community
Pion has an active community on the [Discord](https://discord.gg/PngbdqpFbt).

Follow the [Pion Bluesky](https://bsky.app/profile/pion.ly) or [Pion Twitter](https://twitter.com/_pion) for project updates and important WebRTC news.

We are always looking to support **your projects**. Please reach out if you have something to build!
If you need commercial support or don't want to use public methods you can contact us at [team@pion.ly](mailto:team@pion.ly)

### Contributing
Check out the [contributing wiki](https://github.com/pion/webrtc/wiki/Contributing) to join the group of amazing people making this project possible

### License
MIT License - see [LICENSE](LICENSE) for full text
