/**
 * @module http
 * @overview github http client
 */
import axios from 'axios';

export const inject = {
  name: 'http',
};

export default function () {
  const client = axios.create({
    timeout: 1000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return client;
}
