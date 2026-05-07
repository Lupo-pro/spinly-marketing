import PostCard, { type PostCardData } from './PostCard'
import { SPINLY_BRAND } from '../_styles/brand'

export default function PostsGrid({ posts }: { posts: PostCardData[] }) {
  if (!posts.length) {
    return (
      <div
        style={{
          padding: '48px 24px',
          textAlign: 'center',
          color: SPINLY_BRAND.text.tertiary,
          fontSize: 14,
          background: 'rgba(255,255,255,0.02)',
          border: `1px dashed ${SPINLY_BRAND.border.hover}`,
          borderRadius: 12
        }}
      >
        Aucun post pour le moment. Le cron tourne tous les jours à 6h Colombia,
        ou clique « Générer maintenant » pour déclencher une fournée.
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 12
      }}
    >
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
