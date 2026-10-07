import { useLayoutEffect } from 'react';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TaskList from '../components/TaskList';
import { colors } from '../theme/theme';

export default function TasksScreen({ navigation }) {
  useLayoutEffect(() => {
    navigation.setOptions({ headerRight: () => <Pressable onPress={() => navigation.navigate('TaskForm', {})} hitSlop={10} accessibilityLabel="Add task"><Ionicons name="add-circle" size={30} color={colors.blue} /></Pressable> });
  }, [navigation]);
  return <TaskList navigation={navigation} />;
}
