import { parseArgs } from "jsr:@std/cli/parse-args"
import { exists } from "@std/fs"
import { join } from "@std/path"
import { Issue } from "./Model/Issue.ts"
import { EventStorage } from "./Model/Event.ts"
import { TitleHeaders, ZhcnLabels, EnLabels } from "./Model/Record.ts"
import { ParseMarkdownToJSON, SanitizeFolderName } from "./Method.ts"

const flags = parseArgs(Deno.args, {
  string: [
    "owner",
    "repo",
    "issue",
    "token",
  ],
})

if (!flags.owner || !flags.repo || !flags.issue || !flags.token) {
  console.error("Missing required flags")
  Deno.exit(1)
}

const url = `https://api.github.com/repos/${flags.owner}/${flags.repo}/issues/${flags.issue}`

const response = await fetch(url, {
  headers: {
    "Authorization": `Bearer ${flags.token}`, // 使用 Token 授权
    "Accept": "application/vnd.github+json", // GitHub API 的版本标识
  },
})

if (!response.ok) {
  throw new Error(`Failed to fetch issue: ${response.statusText}`)
}

const issue: Issue = await response.json()

let haveApproveLabel = false
for (const label of issue.labels) {
  if (label.name === "approve") {
    haveApproveLabel = true
    break
  }
}
if (!haveApproveLabel) {
  console.error("Missing 'approve' label")
  Deno.exit(1)
}


const issueLanguageKey = Object.keys(TitleHeaders).find((key) => {
  return issue.title.trim().startsWith(key)
})

if (!issueLanguageKey) {
  console.error("Missing issue language key")
  Deno.exit(1)
}

let labels: Record<string, string>

const issueLanguage = TitleHeaders[issueLanguageKey]

switch (issueLanguage) {
  case "en":
    {
      labels = EnLabels
    }
    break
  case "zhcn":
    {
      labels = ZhcnLabels
    }
    break
  default:
    console.error("Unsupported issue language")
    Deno.exit(1)
}

if (!issue.body) {
  console.error("Missing issue body")
  Deno.exit(1)
}

const eventStorage: EventStorage = ParseMarkdownToJSON(issue.body, labels)

if (!eventStorage.id) {
  console.error("Missing event id")
  Deno.exit(1)
}

// 将 eventStorage 写入到 作者名 / id.json 文件中

// 名字需要合法（不包含特殊字符等）
const authorName = SanitizeFolderName(eventStorage.author)
const titleName = SanitizeFolderName(eventStorage.title)
const id = SanitizeFolderName(eventStorage.id)

if (!authorName) {
  console.error("Missing author name")
  Deno.exit(1)
}

const folder = join(".", "Events", authorName)
if (!await exists(folder)) {
  await Deno.mkdir(folder, { recursive: true })
}

const path = join(folder, `${titleName}_${id}.json`)

await Deno.writeTextFile(path, JSON.stringify(eventStorage, null, 2))

Deno.exit(0)
