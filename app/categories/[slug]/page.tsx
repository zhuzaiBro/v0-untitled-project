import { createServerClient } from "@/lib/supabase/server"
import type { Post, Category } from "@/types"
import { BlogPostCard } from "@/components/blog-post-card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

export const revalidate = 60 // 每分钟重新验证页面

async function getCategoryBySlug(slug: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).single()

  if (error) {
    console.error("Error fetching category:", error)
    return null
  }

  return data as Category
}

async function getPostsByCategory(categoryId: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("post_categories")
    .select(`
      post_id,
      posts(
        *,
        user_profiles(id, username, display_name, avatar_url)
      )
    `)
    .eq("category_id", categoryId)
    .eq("posts.published", true)
    .order("posts.created_at", { ascending: false })

  if (error) {
    console.error("Error fetching posts by category:", error)
    return []
  }

  // 转换数据结构以匹配我们的类型
  return data.map((item) => ({
    ...item.posts,
    author: item.posts.user_profiles,
  })) as Post[]
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategoryBySlug(params.slug)

  if (!category) {
    notFound()
  }

  const posts = await getPostsByCategory(category.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/categories" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回分类列表
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{category.name}</h1>
        {category.description && <p className="text-muted-foreground">{category.description}</p>}
      </div>

      {posts.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">该分类下暂无文章</p>
          <Link href="/blog/create">
            <Button>创建文章</Button>
          </Link>
        </div>
      )}
    </div>
  )
}
