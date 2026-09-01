import gettingStarted from './gettingStarted';
import conversations from './conversations';
import replying from './replying';
import contacts from './contacts';
import inboxes from './inboxes';
import team from './team';
import productivity from './productivity';
import campaigns from './campaigns';
import helpCenter from './helpCenter';
import reports from './reports';
import assignment from './assignment';

export const TOURS = [
  gettingStarted,
  conversations,
  replying,
  contacts,
  inboxes,
  team,
  productivity,
  campaigns,
  helpCenter,
  reports,
  assignment,
].sort((a, b) => a.order - b.order);

export const getTourById = id => TOURS.find(tour => tour.id === id);
