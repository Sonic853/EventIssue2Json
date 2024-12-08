import { exists, walk } from "@std/fs"
import { join } from "@std/path"
import { EventStorage, Event, EventGroup } from "./Model/Event.ts"
import { Body } from "./Model/Body.ts"
import { FormatWithTimezone, GetRegularEventDate } from "./Method.ts"
import { TranslationJ } from "./Model/Tags.ts"
// 使用 Deno 循环一遍 Events 文件夹下的所有 json 文件

const eventsFolder = join(".", "Events")

const events: Event[] = []
const platforms: Record<string, number> = {}
const tags: Record<string, number> = {}
const i18nTags = Deno.readTextFileSync(join(".", "i18n", "tags.json"))
const i18nJson: TranslationJ = i18nTags ? JSON.parse(i18nTags) : {}
/**
 * 从今天开始最大的天数
 */
const maximumDate = 7

const now = new Date()
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
const maxday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + maximumDate, 0, 0, 0, 0)

try {
  // Walk through all files in the "Events" directory and its subdirectories
  for await (const entry of walk(eventsFolder, { exts: [".json"], includeDirs: false })) {
    const fileContent = await Deno.readTextFile(entry.path)
    const jsonData: EventStorage = JSON.parse(fileContent)

    const startTime = new Date(`${jsonData.start}${jsonData.timezone}`)
    if (isNaN(startTime.getTime())) {
      console.warn(`Invalid start date for event: ${jsonData.start}${jsonData.timezone} in file: ${entry.path}`)
      continue
    }
    if (
      (startTime > maxday
        || startTime < today)
      && !jsonData.regular_event
    ) {
      continue
    }

    // 如果是定期活动
    if (jsonData.regular_event) {
      const endTime = jsonData.end ? new Date(`${jsonData.end}${jsonData.timezone}`) : undefined
      // 计算出到活动结束所需要的时间
      const endTimeIsValid = endTime && !isNaN(endTime.getTime())
      const time = endTimeIsValid ? endTime.getTime() - startTime.getTime() : 0
      let maximum_duration: Date
      if (jsonData.maximum_duration) {
        maximum_duration = new Date(`${jsonData.maximum_duration}${jsonData.timezone}`)
        if (isNaN(maximum_duration.getTime())) {
          console.warn(`Invalid start date for event: ${jsonData.maximum_duration}${jsonData.timezone} in file: ${entry.path}`)
          continue
        }
        else if (maximum_duration < today) {
          continue
        }
        if (maximum_duration > maxday) {
          maximum_duration = new Date(maxday)
        }
      }
      else {
        maximum_duration = new Date(maxday)
      }
      const dates = GetRegularEventDate(startTime, today, maximum_duration, jsonData.event_often)
      if (dates.length === 0) {
        continue
      }

      let group: EventGroup | string

      if (!jsonData.group_id) {
        group = jsonData.group_name
      }
      else {
        group = {
          name: jsonData.group_name,
          id: jsonData.group_id
        }
      }
      dates.forEach((date) => {
        const thisEndTime = endTimeIsValid ? new Date(date.getTime() + time) : undefined
        const event: Event = {
          id: jsonData.id,
          author: jsonData.author,
          // start: `${date}${jsonData.timezone}`,
          start: FormatWithTimezone(date, jsonData.timezone),
          end: !thisEndTime ? "" : FormatWithTimezone(thisEndTime, jsonData.timezone),
          location: jsonData.location,
          instance_type: jsonData.instance_type,
          platform: jsonData.platform,
          tags: [
            ...jsonData.tags,
            ...jsonData.tags_other
          ],
          language: jsonData.language,
          title: jsonData.title,
          description: jsonData.description,
          require: jsonData.require,
          join: jsonData.join,
          note: jsonData.note,
          group,
        }
        event.platform.forEach((platform) => {
          platforms[platform] = (platforms[platform] || 0) + 1
        })

        event.tags.forEach((tag) => {
          tags[tag] = (tags[tag] || 0) + 1
        })
        events.push(event)
      })
    }
    else {
      const event: Event = {
        id: jsonData.id,
        author: jsonData.author,
        start: `${jsonData.start}${jsonData.timezone}`,
        end: !jsonData.end ? "" : `${jsonData.end}${jsonData.timezone}`,
        location: jsonData.location,
        instance_type: jsonData.instance_type,
        platform: jsonData.platform,
        tags: [
          ...jsonData.tags,
          ...jsonData.tags_other
        ],
        language: jsonData.language,
        title: jsonData.title,
        description: jsonData.description,
        require: jsonData.require,
        join: jsonData.join,
        note: jsonData.note,
      }

      event.platform.forEach((platform) => {
        platforms[platform] = (platforms[platform] || 0) + 1
      })

      event.tags.forEach((tag) => {
        tags[tag] = (tags[tag] || 0) + 1
      })

      if (!jsonData.group_id) {
        event.group = jsonData.group_name
      }
      else {
        event.group = {
          name: jsonData.group_name,
          id: jsonData.group_id
        }
      }

      events.push(event)
    }
  }
} catch (error) {
  console.error("Error processing files:", error)
  Deno.exit(1)
}

// 根据时间排序
events.sort((a, b) => {
  const dateA = new Date(a.start)
  const dateB = new Date(b.start)
  return dateA.getTime() - dateB.getTime()
})

// 将 events 写入到 pages/events.json 文件中
const data: Body = {
  imageCount: 0,
  platform: platforms,
  tags: tags,
  i18n: i18nJson,
  events: events
}
const eventsData = JSON.stringify(data, null, 2)
const folder = join(".", "pages")
if (!await exists(folder)) {
  await Deno.mkdir(folder, { recursive: true })
}
await Deno.writeTextFile(join(folder, "events.json"), eventsData)
