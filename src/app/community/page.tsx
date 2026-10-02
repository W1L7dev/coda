"use client";

import { FormEvent, useEffect, useState } from "react";
import { faComment, faHeart, faPaperPlane, faTrash, faUsers } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/lib/app-context";
import AppSidebar from "../app-sidebar";

type Post = { id: string; user_id: string; author_name: string; author_avatar: string | null; content: string; created_at: string; likes: number; liked: boolean };

export default function CommunityPage() {
  const { language } = useApp();
  const fr = language === "fr";
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState("");
  const [userId, setUserId] = useState("");
  const [author, setAuthor] = useState({ name: "Musician", avatar: null as string | null });
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      const [{ data: postData, error: postError }, { data: likeData }, { data: profile }] = await Promise.all([
        supabase.from("community_posts").select("id, user_id, author_name, author_avatar, content, created_at").order("created_at", { ascending: false }),
        supabase.from("community_post_likes").select("post_id, user_id"),
        supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
      ]);
      const likes = (likeData ?? []) as { post_id: string; user_id: string }[];
      setAuthor({ name: profile?.full_name || user.email?.split("@")[0] || "Musician", avatar: profile?.avatar_url ?? null });
      if (postError) setError(fr ? "Impossible de charger la communauté." : "We could not load the community.");
      setPosts(((postData ?? []) as Omit<Post, "likes" | "liked">[]).map((post) => ({ ...post, likes: likes.filter((like) => like.post_id === post.id).length, liked: likes.some((like) => like.post_id === post.id && like.user_id === user.id) })));
      setLoading(false);
    };
    load();
  }, [fr, router]);

  const publish = async (event: FormEvent) => {
    event.preventDefault();
    if (!content.trim()) return;
    setPosting(true); setError("");
    const { data, error: postError } = await createClient().from("community_posts").insert({ user_id: userId, author_name: author.name, author_avatar: author.avatar, content: content.trim() }).select("id, user_id, author_name, author_avatar, content, created_at").single();
    if (postError) setError(fr ? "Impossible de publier ce message." : "We could not publish this post.");
    else if (data) { setPosts((current) => [{ ...(data as Omit<Post, "likes" | "liked">), likes: 0, liked: false }, ...current]); setContent(""); }
    setPosting(false);
  };

  const like = async (post: Post) => {
    const supabase = createClient();
    if (post.liked) await supabase.from("community_post_likes").delete().eq("post_id", post.id).eq("user_id", userId);
    else await supabase.from("community_post_likes").insert({ post_id: post.id, user_id: userId });
    setPosts((current) => current.map((item) => item.id === post.id ? { ...item, liked: !post.liked, likes: item.likes + (post.liked ? -1 : 1) } : item));
  };
  const remove = async (id: string) => {
    const { error: deleteError } = await createClient().from("community_posts").delete().eq("id", id);
    if (deleteError) setError(fr ? "Impossible de supprimer ce message." : "We could not delete this post.");
    else setPosts((current) => current.filter((post) => post.id !== id));
  };

  if (loading) return <main className="dashboard-page" />;
  return <main className="dashboard-page community-page"><AppSidebar active="community" /><section className="community-content">
    <header className="community-heading"><div><p className="eyebrow"><span className="eyebrow-line" /> Coda</p><h1>{fr ? "Communauté" : "Community"}</h1><p>{fr ? "Un fil pour les musicien·nes en mouvement." : "A feed for musicians in motion."}</p></div></header>
    <div className="community-layout"><main className="community-feed">
      <form className="community-composer" onSubmit={publish}><div className="community-avatar">{author.avatar ? <img src={author.avatar} alt="" /> : author.name[0]?.toUpperCase()}</div><div className="community-compose-body"><textarea value={content} onChange={(event) => setContent(event.target.value)} maxLength={500} placeholder={fr ? "Qu'est-ce qui vous accompagne aujourd'hui ?" : "What is accompanying you today?"} aria-label={fr ? "Votre message" : "Your post"} /><div className="community-compose-footer"><span>{content.length}/500</span><button className="button button-accent button-small" disabled={posting || !content.trim()} type="submit"><FontAwesomeIcon icon={faPaperPlane} /> {posting ? (fr ? "Publication..." : "Posting...") : (fr ? "Publier" : "Post")}</button></div></div></form>
      {posts.length ? posts.map((post) => <article className="community-post" key={post.id}><div className="community-avatar">{post.author_avatar ? <img src={post.author_avatar} alt="" /> : post.author_name[0]?.toUpperCase()}</div><div className="community-post-body"><div className="community-post-meta"><strong>{post.author_name}</strong><time dateTime={post.created_at}>{new Intl.DateTimeFormat(fr ? "fr-FR" : "en-US", { month: "short", day: "numeric" }).format(new Date(post.created_at))}</time>{post.user_id === userId && <button type="button" onClick={() => remove(post.id)} aria-label={fr ? "Supprimer" : "Delete"}><FontAwesomeIcon icon={faTrash} /></button>}</div><p>{post.content}</p><div className="community-post-actions"><button className={post.liked ? "liked" : ""} type="button" onClick={() => like(post)}><FontAwesomeIcon icon={faHeart} /> <span>{post.likes}</span></button><button type="button"><FontAwesomeIcon icon={faComment} /> <span>{fr ? "Répondre" : "Reply"}</span></button></div></div></article>) : <div className="community-empty"><FontAwesomeIcon icon={faUsers} /><h2>{fr ? "Le fil commence ici." : "The feed starts here."}</h2><p>{fr ? "Partagez une idée, une écoute ou une petite victoire." : "Share an idea, a listening note, or a small win."}</p></div>}
    </main><aside className="community-aside"><span className="summary-kicker">{fr ? "À propos du fil" : "About the feed"}</span><h2>{fr ? "Des notes de pratique, pas de performance." : "Practice notes, not performance."}</h2><p>{fr ? "Un endroit calme pour partager le travail réel derrière la musique." : "A quieter place to share the real work behind the music."}</p></aside></div>
    {error && <p className="auth-error" role="alert">{error}</p>}
  </section></main>;
}
