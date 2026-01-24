import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare, Send } from 'lucide-react';

export default function CommentsTab({ findingId }) {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', findingId],
    queryFn: () => base44.entities.Comment.filter({ finding_id: findingId }, '-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Comment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', findingId] });
      setCommentText('');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    createMutation.mutate({
      finding_id: findingId,
      comment_text: commentText,
      comment_type: 'Comment',
      author_name: user?.full_name || 'Unknown',
    });
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold text-slate-900 mb-4">Comments</h3>

        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            className="mb-3"
          />
          <Button 
            type="submit" 
            size="sm"
            disabled={createMutation.isPending || !commentText.trim()}
          >
            <Send className="w-4 h-4 mr-2" />
            {createMutation.isPending ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>

        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-slate-900">{comment.author_name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(comment.created_date).toLocaleString()}
                    </p>
                  </div>
                  {comment.comment_type !== 'Comment' && (
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {comment.comment_type}
                    </span>
                  )}
                </div>
                <p className="text-slate-700 whitespace-pre-wrap">{comment.comment_text}</p>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}