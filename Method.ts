import { EventStorage } from "./Model/Event.ts"
import { Languages, OftenOptions } from "./Model/Record.ts"

export const ParseMarkdownToJSON = (md: string, labels: Record<string, string>): EventStorage => {
  // 如果换行为 "\r\n", 则需要将 "\r\n" 替换为 "\n"
  md = md.replace(/\r\n/g, "\n")
  const sections = md.split("\n### ").map((section) => section.trim())
  // deno-lint-ignore no-explicit-any
  const data: Record<string, any> = {}

  const isZhcn = labels["language"] === "zh-CN"
  const isEn = labels["language"] === "en"

  sections.forEach((section) => {
    const [first, ...valueParts] = section.split("\n")
    const key = first.startsWith("### ") ? first.replace("### ", "").trim() : first.trim()
    const value = valueParts.join("\n").trim()

    if (
      (isZhcn && (key === "支持平台" || key === "标签"))
      || (isEn && (key === "Event Platform" || key === "Tags"))
    ) {
      // Parse list
      const dataStrings: string[] = data[labels[key]] || []
      dataStrings.push(...value
        .split("\n")
        .filter((line) => line.includes("[X]"))
        .map((line) => line.replace(/- \[X\] /, "").trim())
      )
      const uniqueStrings = [...new Set(dataStrings)]
      data[labels[key]] = uniqueStrings
    }
    else if (
      (isZhcn && key === "是否是定期活动？")
      || (isEn && key === "Is Regular Event?")
    ) {
      data[labels[key]] = value.includes("[X]")
    }
    else if (
      (isZhcn && key === "该活动多久举办一次？")
      || (isEn && key === "How Often?")
    ) {
      const option = OftenOptions[labels["language"]][value]
      data[labels[key]] = option || ""
    }
    else if (
      (isZhcn && key === "活动语言")
      || (isEn && key === "Event Language")
    ) {
      const option = Languages[value]
      data[labels[key]] = option || ""
    }
    else if (
      (isZhcn && key === "其他标签对应的英文")
      || (isEn && key === "Other Tags")
    ) {
      if (value !== "None" && value !== "_No response_") {
        // const dataTags: string[] = data["tags"] || []
        // 先将中文逗号转为英文逗号，再分割
        const tags = value
          .replaceAll("，", ",")
          .split(",")
          .map((tag) => tag.trim())
        // dataTags.push(...tags)
        // const uniqueTags = [...new Set(dataTags)]
        // data["tags"] = uniqueTags
        data[labels[key]] = tags
      }
    }
    else if (
      isZhcn && key === "其他标签"
    ) {
      if (value !== "None" && value !== "_No response_") {
        // 先将中文逗号转为英文逗号，再分割
        const tags = value
          .replaceAll("，", ",")
          .split(",")
          .map((tag) => tag.trim())
        data[labels[key]] = tags
      }
    }
    else if (labels[key]) {
      if (value !== "None" && value !== "_No response_") {
        data[labels[key]] = value
      }
      else {
        data[labels[key]] = ""
      }
    }
  })

  return {
    id: data["id"],
    author: data["author"],
    start: data["start"],
    end: data["end"] || "",
    timezone: data["timezone"] || "",
    location: data["location"] || "",
    instance_type: data["instance_type"] || "",
    platform: data["platform"] || [],
    tags: data["tags"] || [],
    tags_other: data["tags_other"] || [],
    tags_other_zhcn: data["tags_other_zhcn"] || [],
    group_name: data["group_name"] || "",
    group_id: data["group_id"] || "",
    language: data["language"] || "",
    title: data["title"],
    description: data["description"] || "",
    require: data["require"],
    join: data["join"],
    note: data["note"],
    regular_event: data["regular_event"],
    event_often: data["event_often"],
    maximum_duration: data["maximum_duration"],
  }
}

export const SanitizeFolderName = (input: string): string => {
  // deno-lint-ignore no-control-regex
  const invalidChars = /[<>:"/\\|?*\x00-\x1F]/g
  const sanitized = input.replace(invalidChars, "_").trim()
  return sanitized
}