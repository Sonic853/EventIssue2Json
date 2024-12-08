export interface EventContent {
  /**
   * 活动名称
   */
  title: string
  /**
   * 活动描述
   */
  description: string
  /**
   * 活动要求
   */
  require: string
  /**
   * 参加方式
   */
  join: string
  /**
   * 备注
   */
  note: string
}
export interface EventBase extends EventContent {
  /**
   * 活动 ID
   */
  id: string
  /**
   * 举办者
   */
  author: string
  /**
   * 活动开始时间
   */
  start: string
  /**
   * 活动结束时间
   */
  end: string
  /**
   * 活动地点
   */
  location: string
  /**
   * 房间类型
   */
  instance_type: string
  /**
   * 支持平台
   */
  platform: string[]
  /**
   * 标签
   */
  tags: string[]
  /**
   * 活动语言
   */
  language: string
  /**
   * 多语言
   */
  multilingual?: Record<string, EventContent>
}
export interface Event extends EventBase {
  /**
   * 组
   */
  group?: EventGroup | string
}
export interface EventGroup {
  /**
   * VRChat 组名称
   */
  name: string
  /**
   * 组 ID
   */
  id: string
}
export interface EventStorage extends EventBase {
  /**
   * VRChat 组名称
   */
  group_name: string
  /**
   * 组 ID
   */
  group_id: string
  /**
   * 时区
   */
  timezone: string
  /**
   * 是否是定期活动
   */
  regular_event: boolean
  /**
   * 该活动多久举办一次
   */
  event_often: string
  /**
   * 定期活动最大持续时间
   */
  maximum_duration: string
  /**
   * 标签
   */
  tags_other: string[]
  /**
   * 标签（中文）
   */
  tags_other_zhcn: string[]
}