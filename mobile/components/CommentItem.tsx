import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReportButton } from './ReportButton';
import type { Comment } from '@/types/api';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  isLiked?: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

export function CommentItem({ comment, currentUserId, onLike, onDelete, isLiked }: CommentItemProps) {
  const isOwner = comment.authorId === currentUserId;

  return (
    <View className="flex-row mb-4">
      <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-3 mt-1 flex-shrink-0">
        <Text className="text-xs font-bold text-blue-600">
          {(comment.authorName ?? '?')[0].toUpperCase()}
        </Text>
      </View>

      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text className="text-sm font-semibold text-gray-800 mr-2">
            {comment.authorName ?? 'Anonyme'}
          </Text>
          <Text className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</Text>
        </View>

        <Text className="text-sm text-gray-700 leading-5">{comment.content}</Text>

        <View className="flex-row items-center mt-2 gap-4">
          <TouchableOpacity
            onPress={() => onLike(comment.id)}
            className="flex-row items-center"
            hitSlop={8}
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={14}
              color={isLiked ? '#ef4444' : '#9ca3af'}
            />
            {comment.likes > 0 && (
              <Text className="text-xs text-gray-400 ml-1">{comment.likes}</Text>
            )}
          </TouchableOpacity>

          {isOwner ? (
            <TouchableOpacity onPress={() => onDelete(comment.id)} hitSlop={8}>
              <Ionicons name="trash-outline" size={14} color="#9ca3af" />
            </TouchableOpacity>
          ) : (
            currentUserId && <ReportButton commentId={comment.id} compact />
          )}
        </View>
      </View>
    </View>
  );
}
