import { RouteHandlerMethod } from 'fastify';

type LocalizedString = {
  language: string;
  value: string;
};

type AuthenticateNidRequest = {
  nid: string;
  demographics: {
    name: LocalizedString[];
    gender: LocalizedString[];
    dob: string;
  };
};

const stubbedInvidiualInfo = [
  {
    nid: '1234567890',
    name: [{ language: 'en', value: 'John Doe' }],
    gender: [{ language: 'en', value: 'male' }],
    dob: '1990-01-01',
    status: 'active'
  },
  {
    nid: '1253467890',
    name: [{ language: 'en', value: 'Jane Doe' }],
    gender: [{ language: 'en', value: 'female' }],
    dob: '1992-01-01',
    status: 'active'
  },
  {
    nid: '1253467890',
    name: [{ language: 'en', value: 'Jane Doe' }],
    gender: [{ language: 'en', value: 'female' }],
    dob: '1992-01-01',
    status: 'active'
  }
];
export const authenticateNidHandler: RouteHandlerMethod = async (
  request,
  reply
) => {
  return 'Not implemented';
};
