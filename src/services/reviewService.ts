// reviewService.ts
// Basic review service for the ExpertProfileScreen

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date?: string;
  professionalId: string;
}

class ReviewService {
  // Mock implementation - replace with actual API calls
  async getReviewsForProfessional(professionalId: string): Promise<{ data: Review[] }> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const reviews: Review[] = [
          {
            id: '1',
            userName: 'Sarah M.',
            rating: 5,
            comment: 'Excellent session! Dr. Anya helped me with my stress management techniques. Very knowledgeable and patient.',
            date: '2024-01-15',
            professionalId,
          },
          {
            id: '2',
            userName: 'Mike R.',
            rating: 4,
            comment: 'Very knowledgeable and patient. Highly recommend! The yoga therapy session was exactly what I needed.',
            date: '2024-01-10',
            professionalId,
          },
          {
            id: '3',
            userName: 'Priya S.',
            rating: 5,
            comment: 'Amazing experience! Dr. Anya is very professional and understanding. Helped me with my back pain significantly.',
            date: '2024-01-08',
            professionalId,
          },
          {
            id: '4',
            userName: 'John D.',
            rating: 4,
            comment: 'Great session. Very calming and therapeutic. Would definitely book again.',
            date: '2024-01-05',
            professionalId,
          },
        ];
        resolve({ data: reviews });
      }, 800);
    });
  }

  async addReview(professionalId: string, review: Omit<Review, 'id' | 'professionalId'>): Promise<{ data: Review }> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const newReview: Review = {
          id: 'review_' + Date.now(),
          ...review,
          professionalId,
          date: new Date().toISOString().split('T')[0],
        };
        resolve({ data: newReview });
      }, 1000);
    });
  }

  async getAverageRating(professionalId: string): Promise<{ data: { average: number; count: number } }> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          data: { 
            average: 4.5, 
            count: 24 
          } 
        });
      }, 300);
    });
  }

  async updateReview(reviewId: string, updates: Partial<Review>): Promise<{ data: Review }> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        const updatedReview: Review = {
          id: reviewId,
          userName: 'Sarah M.',
          rating: 5,
          comment: 'Updated review comment',
          date: '2024-01-15',
          professionalId: '1',
          ...updates,
        };
        resolve({ data: updatedReview });
      }, 800);
    });
  }

  async deleteReview(reviewId: string): Promise<{ data: { success: boolean } }> {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ data: { success: true } });
      }, 500);
    });
  }
}

export const reviewService = new ReviewService(); 