export interface Label {
  id: number
  node_id: string
  url: string
  name: string
  description: string | null
  color: string
  default: boolean
}

export interface User {
  login: string
  id: number
  node_id: string
  avatar_url: string
  url: string
  html_url: string
  type: string
  site_admin: boolean
}

export interface Issue {
  id: number
  node_id: string
  url: string
  repository_url: string
  labels_url: string
  comments_url: string
  events_url: string
  html_url: string
  number: number
  state: "open" | "closed"
  title: string
  body: string // Markdown 内容
  user: User // 创建 Issue 的用户
  labels: Label[] // Issue 的标签
  assignee: User | null // 被分配人
  assignees: User[] // 所有分配人
  milestone: {
    title: string
    description: string | null
    due_on: string | null
    state: "open" | "closed"
  } | null // 里程碑
  locked: boolean
  comments: number // 评论数
  created_at: string // 创建时间
  updated_at: string // 更新时间
  closed_at: string | null // 关闭时间
  author_association: string
  active_lock_reason: string | null
}
