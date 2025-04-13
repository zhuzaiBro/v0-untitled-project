import { BlogPostCard } from "@/components/blog-post-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { createServerClient } from "@/lib/supabase/server"
import type { Post } from "@/types"

export const revalidate = 60 // 每分钟重新验证页面

async function getPosts() {
  const supabase = createServerClient()

  // 使用正确的表名 user_profiles 而不是 users
  // 只获取已发布且公开的文章
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      user_profiles(id, username, display_name, avatar_url)
    `)
    .eq("published", true)
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(6)

  if (error) {
    console.error("Error fetching posts:", error)
    return []
  }

  // 转换数据结构以匹配我们的类型
  return data.map((post) => ({
    ...post,
    author: post.user_profiles,
  })) as Post[]
}

export default async function Home() {
  const posts = await getPosts()

  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">我的博客</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">分享关于 Web 开发、设计和技术的见解和教程</p>
        </div>

        <div className="flex justify-center mb-8">
          <Link href="/blog/create">
            <Button size="lg">创建新文章</Button>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6">最新文章</h2>
        {posts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">还没有发布的公开文章</p>
            <Link href="/blog/create">
              <Button>创建第一篇文章</Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  )
}
