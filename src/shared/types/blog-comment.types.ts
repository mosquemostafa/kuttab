export type BlogCommentDTO = {
  id: string;
  blogId: string;
  userId: string;
  /** Display name from joined `users.name` */
  authorName: string;
  /** Profile image URL from joined `users.image` */
  authorImage: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
};
