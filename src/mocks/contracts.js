export const USER_ROLES = ['teacher', 'student'];
export const PARTICIPANT_MODES = ['free', 'approval'];

export const isUserRole = (value) => USER_ROLES.includes(value);
export const isParticipantMode = (value) => PARTICIPANT_MODES.includes(value);
