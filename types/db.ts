/** Questions 集合：地理题目 */
export interface Question {
  _id: string;
  original_image_url: string; // Cloud Storage fileID 或可访问 URL
  true_location: string;
  created_at: number;
}

/** Submissions 集合：玩家提交 */
export interface Submission {
  _id: string;
  question_id: string;
  annotated_image_url: string; // Cloud Storage fileID
  thought_process: string;
  submitted_at: number;
}

export interface QuestionPublic {
  _id: string;
  original_image_url: string;
}
