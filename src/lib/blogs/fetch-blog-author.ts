import "server-only";

import { userRepository } from "@/server/modules/users/user.repository";

export type BlogAuthorDisplay = {
  name: string;
  image: string | null;
};

export async function fetchBlogAuthorDisplay(
  authorId: string,
): Promise<BlogAuthorDisplay | null> {
  return userRepository.findPublicDisplayById(authorId);
}
