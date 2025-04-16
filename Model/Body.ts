import { Event } from "./Event.ts"
import { TranslationJ } from "./I18n.ts"

export interface Body {
  /**
   * 图片数量
   */
  imageCount: number
  /**
   * 平台
   */
  platform: Record<string, number>
  /**
   * 标签
   */
  tags: Record<string, number>
  /**
   * 翻译
   */
  i18n: TranslationJ
  /**
   * 活动
   */
  events: Event[]
  /**
   * 名称
   */
  name?: string
  /**
   * 信息
   */
  description?: string
  /**
   * 语言
   */
  language?: string
  /**
   * 链接/订阅地址
   */
  url?: string
  /**
   * 提交活动地址
   */
  submitUrl?: string
}