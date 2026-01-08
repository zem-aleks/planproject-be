export type CompetitorEntity = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  whyCompetitor: string;
  url: string | null;
  usp: string | null;
  usersStats: string | null;
  experienceToReuse: string | null;
  competitionRating: number;

  createdAt: Date;
  updatedAt: Date;
};
