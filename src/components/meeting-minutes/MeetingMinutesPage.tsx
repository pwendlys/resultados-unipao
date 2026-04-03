
import { useState } from 'react';
import MeetingMinutesList from './MeetingMinutesList';
import MeetingMinutesForm from './MeetingMinutesForm';
import MeetingMinutesDetail from './MeetingMinutesDetail';

const MeetingMinutesPage = () => {
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [selectedMinutesId, setSelectedMinutesId] = useState<string | null>(null);

  const handleNewMinutes = () => setView('form');
  
  const handleViewDetail = (id: string) => {
    setSelectedMinutesId(id);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedMinutesId(null);
  };

  const handleCreated = (id: string) => {
    setSelectedMinutesId(id);
    setView('detail');
  };

  switch (view) {
    case 'form':
      return <MeetingMinutesForm onBack={handleBack} onCreated={handleCreated} />;
    case 'detail':
      return selectedMinutesId ? (
        <MeetingMinutesDetail minutesId={selectedMinutesId} onBack={handleBack} />
      ) : null;
    default:
      return <MeetingMinutesList onNewMinutes={handleNewMinutes} onViewDetail={handleViewDetail} />;
  }
};

export default MeetingMinutesPage;
