import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('https://api.prokerala.com/v2/astrology/natal-chart', () => {
    return HttpResponse.json({
      planets: [
        { name: 'Soleil', longitude: 120, house: 1, sign: 'Lion', retrograde: false }
      ],
      houses: [
        { number: 1, sign: 'Lion', degree: 15 }
      ],
      ascendant: { sign: 'Lion', degree: 15 }
    });
  }),

  http.post('https://api.prokerala.com/v2/astrology/daily-guidance', () => {
    return HttpResponse.json({
      summary: 'Test summary',
      love: 'Test love guidance',
      work: 'Test work guidance',
      energy: 'Test energy guidance'
    });
  })
];