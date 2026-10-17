import { Navigate, useParams } from "react-router-dom";
import { getManualTopic } from "./manual-topics";

export function ManualArticle() {
  const { slug } = useParams<{ slug: string }>();
  const topic = slug ? getManualTopic(slug) : undefined;

  if (!topic) {
    return <Navigate to="/manual" replace />;
  }

  const { Article } = topic;
  return <Article />;
}
