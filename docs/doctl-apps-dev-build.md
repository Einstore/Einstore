# doctl apps dev build (local build debug)

Generated on 20 Oct 2025 from doctl version v1.146.0.

## Usage

```
doctl apps dev build [component name]
```

## Aliases

- `b`

## Description

[BETA] Build an app component locally.

The component name is optional unless running non-interactively.

All command line flags are optional. You may specify flags to be applied to the current build or use the command `doctl app dev config` to permanently configure default values.

## Flags

| Option | Description |
| --- | --- |
| `--app` | An optional existing app ID. If specified, the app spec will be fetched from the given app. |
| `--build-command` | An optional build command override for local development. |
| `--env-file` | An optional path to a `.env` file with overrides for values of app spec environment variables. |
| `--help, -h` | Help for this command. |
| `--no-cache` | Set to disable build caching. Default: `false`. |
| `--registry` | An optional registry name to tag built container images with. |
| `--spec` | An optional path to an app spec in JSON or YAML format. Default: `.do/app.yaml`. |
| `--timeout` | An optional timeout duration for the build. Valid time units are `s`, `m`, `h`. Example: `15m30s`. Default: `0s`. |

## Related Commands

| Command | Description |
| --- | --- |
| `doctl apps dev` | [BETA] Display commands for working with App Platform local development. |

## Global Flags

| Option | Description |
| --- | --- |
| `--access-token, -t` | API V2 access token. |
| `--api-url, -u` | Override default API endpoint. |
| `--config, -c` | Specify a custom config file. |
| `--context` | Specify a custom authentication context name. |
| `--http-retry-max` | Set maximum number of retries for requests that fail with a 429 or 500-level error. Default: `5`. |
| `--http-retry-wait-max` | Set the minimum number of seconds to wait before retrying a failed request. Default: `30`. |
| `--http-retry-wait-min` | Set the maximum number of seconds to wait before retrying a failed request. Default: `1`. |
| `--interactive` | Enable interactive behavior. Defaults to true if the terminal supports it. Default: `false`. |
| `--output, -o` | Desired output format `text` or `json`. Default: `text`. |
| `--trace` | Show a log of network activity while performing a command. Default: `false`. |
| `--verbose, -v` | Enable verbose output. Default: `false`. |
