const { FORMS } = require('../../config/events');
const { format, parseISO, startOfWeek, differenceInDays, subDays } = require('date-fns');

exports.formatDateOfBirth = (forms) => {
  const dobForm = forms.find(({ id }) => id === FORMS['dateOfBirth']);
  const dobValues = dobForm.values.map(({ value }) => value);
  if (dobValues.every(value => value !== '')) return dobValues.join('-');
  return '0001-01-01';
};

exports.formatPhoneNumber = (phone) => {
  if (phone.length === 10) return '(' + phone.slice(0, 3) + ')' + phone.slice(3, 6) + '-' + phone.slice(6);
  if (phone.length === 11) return phone[0] + '(' + phone.slice(1, 4) + ')' + phone.slice(4, 7) + '-' + phone.slice(7);
  return '';
};

exports.toStartOfWeek = (datetime) => {
  const dateTime = parseISO(datetime);
  const weekStartDate = startOfWeek(dateTime);
  const difference = differenceInDays(dateTime, weekStartDate);
  const newDateTime = subDays(dateTime, difference);
  return format(newDateTime, 'yyyy-MM-dd HH:mm:ss');
};
