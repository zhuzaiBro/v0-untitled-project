import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createServerClient } from "@/lib/supabase/server"
import type { Post } from "@/types"
import { formatDate } from "@/lib/utils"
import { notFound } from "next/navigation"
import { CommentsSection } from "@/components/comments-section"

export const revalidate = 60 // 每分钟重新验证页面

async function getPostBySlug(slug: string) {
  const supabase = createServerClient()

  // 使用正确的表名 user_profiles
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      user_profiles(id, username, display_name, avatar_url)
    `)
    .eq("slug", slug)
    .eq("published", true)
    .single()

  if (error) {
    console.error("Error fetching post:", error)
    return null
  }

  // 转换数据结构以匹配我们的类型
  return {
    ...data,
    author: data.user_profiles,
  } as Post
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)

  if (!post) {
    notFound()
  }

  const author = post.author?.display_name || post.author?.username || "未知作者"

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回首页
      </Link>

      <article className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          <div className="text-muted-foreground">
            {formatDate(post.created_at)} · {author}
          </div>
        </header>

        <div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />

        <CommentsSection postId={post.id} />
      </article>
    </div>
  )
}
