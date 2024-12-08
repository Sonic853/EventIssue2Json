import { join } from "@std/path"
import { EventStorage } from "./Model/Event.ts"
import { InstanceOptions, Languages, OftenOptions } from "./Model/Record.ts"
import { TranslationJ } from "./Model/Tags.ts"

export const ParseMarkdownToJSON = (md: string, labels: Record<string, string>): EventStorage => {
  // 如果换行为 "\r\n", 则需要将 "\r\n" 替换为 "\n"
  md = md.replaceAll(/\r\n/g, "\n")
  const sections = md.split("\n### ").map((section) => section.trim())
  // deno-lint-ignore no-explicit-any
  const data: Record<string, any> = {}

  const language = labels["language"]
  const isZhcn = language === "zh-CN"
  const isEn = language === "en"

  const i18nTags = Deno.readTextFileSync(join(".", "i18n", "tags.json"))
  const i18nJson: TranslationJ = i18nTags ? JSON.parse(i18nTags) : {}

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
      const translationTags: string[] = []
      uniqueStrings.forEach((string) => {
        if (
          i18nJson[string]
          && i18nJson[string][language]
        ) {
          translationTags.push(i18nJson[string][language])
        }
        else {
          translationTags.push(string)
        }
      })
      data[labels[key]] = translationTags
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
      const option = OftenOptions[language][value]
      data[labels[key]] = option || ""
    }
    else if (
      (isZhcn && key === "房间类型")
      || (isEn && key === "Instance Type")
    ) {
      const option = InstanceOptions[language][value]
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

export const GetRegularEventDate = (date: Date, today: Date, maxday: Date, duration: string): Date[] => {
  switch (duration) {
    case "Every Week":
      {
        return GetHaveThisWeekDays(date, today, maxday)
      }
    case "Every Two Weeks":
      {
        return GetBiWeeklyDays(date, today, maxday)
      }
    case "Every Month":
      {
        return GetMonthDays(date, today, maxday)
      }
    case "Every Season":
      {
        return GetSeasonDays(date, today, maxday)
      }
    case "Every Year":
      {
        return GetYearDays(date, today, maxday)
      }
    case "Every Day":
      {
        return GetDays(date, today, maxday)
      }
    default:
      {
        return []
      }
  }
}

export const GetHaveThisWeekDays = (date: Date, today: Date, maxday: Date): Date[] => {
  const week = date.getDay()

  // 确保日期范围有效
  if (today > maxday) {
    throw new Error("Invalid date range: 'today' must be before 'maxday'.")
  }

  const result: Date[] = []

  // 从 today 开始循环到 maxday
  const current = new Date(today)

  while (current <= maxday) {
    // 如果当前日期的星期与目标星期相等，则添加到结果中
    if (current.getDay() === week) {
      result.push(new Date(current.getFullYear(), current.getMonth(), current.getDate(), date.getHours(), date.getMinutes())) // 克隆日期对象
      // 增加一周
      current.setDate(current.getDate() + 7)
    }
    else {
      // 增加一天
      current.setDate(current.getDate() + 1)
    }
  }

  return result
}

export const GetBiWeeklyDays = (date: Date, today: Date, maxday: Date): Date[] => {
  const result: Date[] = []
  const targetDay = date.getDay() // 获取指定日期的星期几（0=周日, 6=周六）

  // 确保日期范围有效
  if (today > maxday) {
    throw new Error("Invalid date range: 'today' must be before 'maxday'.")
  }

  // 找到从 today 开始的第一个符合 targetDay 的日期
  const current = new Date(today)

  // 调整 current 到与 targetDay 相匹配的日期
  while (current.getDay() !== targetDay) {
    current.setDate(current.getDate() + 1)
  }

  // 遍历每两周的日期，直到超过 maxday
  while (current <= maxday) {
    result.push(new Date(current.getFullYear(), current.getMonth(), current.getDate(), date.getHours(), date.getMinutes())) // 克隆日期对象
    current.setDate(current.getDate() + 14) // 每两周增加 14 天
  }

  return result
}

export const GetMonthDays = (date: Date, today: Date, maxday: Date, useLastDay: boolean = true): Date[] => {
  const result: Date[] = []
  const targetDay = date.getDate() // 获取目标日期的天数

  // 确保日期范围有效
  if (today > maxday) {
    throw new Error("Invalid date range: 'today' must be before 'maxday'.")
  }

  const current = new Date(today)

  // 如果 today 的日期不等于 targetDay，尝试设置为 targetDay
  if (current.getDate() !== targetDay) {
    current.setDate(targetDay)
  }

  // 遍历每个月的日期，直到超过 maxday
  while (current <= maxday) {
    const month = current.getMonth()
    const year = current.getFullYear()

    // 判断目标日期是否在当月有效
    const daysInMonth = new Date(year, month + 1, 0).getDate() // 获取当月最后一天

    if (targetDay > daysInMonth) {
      // 如果目标日期超出了当月最大天数
      if (useLastDay) {
        current.setDate(daysInMonth) // 使用当月最后一天
      } else {
        current.setMonth(current.getMonth() + 1) // 跳到下一个月
        continue
      }
    } else {
      // 设置为目标日期
      current.setDate(targetDay)
    }

    result.push(new Date(current.getFullYear(), current.getMonth(), current.getDate(), date.getHours(), date.getMinutes())) // 克隆日期对象

    // 前往下一个月
    current.setMonth(current.getMonth() + 1)
  }

  return result
}
export const GetSeasonDays = (date: Date, today: Date, maxday: Date, useLastDay: boolean = true): Date[] => {
  const result: Date[] = []
  const targetDay = date.getDate() // 获取目标日期的天数

  // 确保日期范围有效
  if (today > maxday) {
    throw new Error("Invalid date range: 'today' must be before 'maxday'.")
  }

  const current = new Date(today)

  // 调整 current 到当前季度的第一个月并设置为目标日期
  const quarterStartMonth = Math.floor(current.getMonth() / 3) * 3
  current.setMonth(quarterStartMonth)
  current.setDate(targetDay)

  // 遍历每个季度
  while (current <= maxday) {
    const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()

    // 处理目标日期是否在当前月份有效
    if (targetDay > daysInMonth) {
      if (useLastDay) {
        current.setDate(daysInMonth) // 使用当前月份的最后一天
      } else {
        current.setMonth(current.getMonth() + 3) // 跳到下一个季度
        continue
      }
    } else {
      current.setDate(targetDay)
    }

    result.push(new Date(current.getFullYear(), current.getMonth(), current.getDate(), date.getHours(), date.getMinutes())) // 克隆日期对象
    current.setMonth(current.getMonth() + 3) // 前往下一个季度
  }

  return result
}
export const GetYearDays = (date: Date, today: Date, maxday: Date, useLastDay: boolean = true): Date[] => {
  const result: Date[] = []
  const targetDay = date.getDate() // 获取目标日期的天数
  const targetMonth = date.getMonth() // 获取目标月份

  // 确保日期范围有效
  if (today > maxday) {
    throw new Error("Invalid date range: 'today' must be before 'maxday'.")
  }

  const current = new Date(today)

  // 调整 current 到当前年份的目标月份和日期
  current.setMonth(targetMonth)
  current.setDate(targetDay)

  // 遍历每年的目标日期
  while (current <= maxday) {
    const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()

    // 处理目标日期是否在当前月份有效
    if (targetDay > daysInMonth) {
      if (useLastDay) {
        current.setDate(daysInMonth) // 使用当前月份的最后一天
      } else {
        current.setFullYear(current.getFullYear() + 1) // 跳到下一年
        continue
      }
    } else {
      current.setDate(targetDay)
    }

    result.push(new Date(current.getFullYear(), current.getMonth(), current.getDate(), date.getHours(), date.getMinutes())) // 克隆日期对象
    current.setFullYear(current.getFullYear() + 1) // 前往下一年
  }

  return result
}
export const GetDays = (date: Date, today: Date, maxday: Date): Date[] => {
  const result: Date[] = []

  // 确保日期范围有效
  if (today > maxday) {
    throw new Error("Invalid date range: 'today' must be before 'maxday'.")
  }

  const current = new Date(today)
  while (current <= maxday) {
    result.push(new Date(current.getFullYear(), current.getMonth(), current.getDate(), date.getHours(), date.getMinutes())) // 克隆日期对象
    current.setDate(current.getDate() + 1) // 前往下一天
  }

  return result
}

export const FormatWithTimezone = (date: Date, timezone: string): string => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: timezone, // 使用输入的时区
    hourCycle: 'h23', // 保持 24 小时制
  }
  const parts = new Intl.DateTimeFormat('en-GB', options).formatToParts(date)

  // 拼接成 ISO8601 格式
  const [year, month, day, hour, minute, second] = [
    parts.find(p => p.type === 'year')?.value,
    parts.find(p => p.type === 'month')?.value,
    parts.find(p => p.type === 'day')?.value,
    parts.find(p => p.type === 'hour')?.value,
    parts.find(p => p.type === 'minute')?.value,
    parts.find(p => p.type === 'second')?.value,
  ]

  return `${year}-${month}-${day}T${hour}:${minute}:${second}${timezone}`
}