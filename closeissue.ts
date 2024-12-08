import { parseArgs } from "jsr:@std/cli/parse-args"

const flags = parseArgs(Deno.args, {
  string: [
    "owner",
    "repo",
    "issue",
    "token",
    "status",
  ],
})

if (!flags.owner || !flags.repo || !flags.issue || !flags.token || !flags.status) {
  console.error("Missing required flags")
  Deno.exit(1)
}

const url = `https://api.github.com/repos/${flags.owner}/${flags.repo}/issues/${flags.issue}`

// Close issue
const response = await fetch(url, {
  method: "PATCH",
  headers: {
    "Authorization": `Bearer ${flags.token}`, // 使用 Token 授权
    "Accept": "application/vnd.github+json", // GitHub API 的版本标识
  },
  body: JSON.stringify({
    state: "closed",
    state_reason: flags.status
  }), // 设置为关闭状态
})

if (!response.ok) {
  console.error(`Failed to close issue: ${response.status} ${response.statusText}`)
  Deno.exit(1)
}

console.log("Issue closed successfully")

Deno.exit(0)
