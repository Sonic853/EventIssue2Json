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
}