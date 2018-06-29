import moment from 'moment';
import _ from 'lodash';

// Progress in %.
let progress = (a, b) => {
  if (a + b === 0) {
    return 0;
  } else {
    return 100 * (a / (b + a));
  }
};

// Calculate the stats for a project.
//  Is it on time? What is the progress?
export default (project) => {
  // Makes testing easier...
  if (project.stats != null) return project.stats;

  let points = 0, a, b, c, time, days, span;

  let stats = {
    'isDone': false,
    'isOnTime': true,
    'isOverdue': false,
    'isEmpty': true
  };

  // Progress in points.
  let i = project.issues.closed.size,
      j = project.issues.open.size;
  if (i) {
    stats.isEmpty = false;
    if (i + j > 0) {
      points = progress(i, j);
      if (points === 100) stats.isDone = true;
    }
  }

  // Check that project hasn't been created after issue close; #100.
  if (project.issues.closed.size) {
    project.created_at = _.reduce(project.issues.closed.list
    , (x, { closed_at }) => (x > closed_at) ? closed_at : x
    , project.created_at);
  }

  // The dates in this project.
  a = moment(project.created_at, moment.ISO_8601);
  b = moment.utc();
  c = moment(project.due_on, moment.ISO_8601);

  // Milestones with no due date are always on track.
  if (!(project.due_on != null)) {
    // The number of days from start to now.
    span = b.diff(a, 'days');
    return _.extend(stats, { span, 'progress': { points } });
  }

  // Overdue? Regardless of the date, if we have closed all
  //  issues, we are no longer overdue.
  if (b.isAfter(c) && !stats.isDone) stats.isOverdue = true;

  // Progress in time.
  time = progress(b.diff(a), c.diff(b));

  // Number of days between start and due date or today if overdue.
  span = (stats.isOverdue ? b : c).diff(a, 'days');

  // How many days is 1% of the time until now?
  days = (b.diff(a, 'days')) / 100;

  // If we have closed all issues, we are "on time".
  stats.isOnTime = stats.isDone || points > time;

  return _.extend(stats, { days, span, 'progress': { points, time } });
};
