import { GroupPage } from '@/components/splitease/group-page';

export const runtime = 'edge';

export default async function GroupDetailsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  return <GroupPage groupId={groupId} />;
}
