'use strict';

const crypto = require('crypto');
const express = require('express');

const router = express.Router();
const referrals = new Map();
const demoOwnerHash = crypto.createHash('sha256').update('5550000000').digest('hex');
referrals.set('CARLOS-BARBER', {
  code: 'CARLOS-BARBER',
  ownerHash: demoOwnerHash,
  bookings: new Set(),
});

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

function phoneHash(phone) {
  return crypto.createHash('sha256').update(phone.replace(/\D/g, '')).digest('hex');
}

function isValidCode(code) {
  return /^[A-Z0-9][A-Z0-9-]{2,63}$/.test(code);
}

function responseFor(referral) {
  return {
    code: referral.code,
    bookings: referral.bookings.size,
    freeHaircuts: referral.bookings.size,
  };
}

router.post('/register', (req, res) => {
  const code = normalizeCode(req.body?.code);
  const phone = typeof req.body?.phone === 'string' ? req.body.phone : '';
  const normalizedPhone = phone.replace(/\D/g, '');

  if (!isValidCode(code) || normalizedPhone.length < 7) {
    return res.status(400).json({ error: 'Código y teléfono válidos son requeridos' });
  }

  const ownerHash = phoneHash(phone);
  const existing = referrals.get(code);
  if (existing && existing.ownerHash !== ownerHash) {
    return res.status(409).json({ error: 'Este código ya pertenece a otro cliente' });
  }

  if (!existing) {
    referrals.set(code, { code, ownerHash, bookings: new Set() });
  }

  res.status(200).json(responseFor(referrals.get(code)));
});

router.get('/:code', (req, res) => {
  const code = normalizeCode(req.params.code);
  if (!isValidCode(code)) {
    return res.status(400).json({ error: 'Código de referido inválido' });
  }

  const referral = referrals.get(code);
  if (!referral) {
    return res.status(404).json({ error: 'Código de referido no encontrado' });
  }

  const phone = typeof req.query.phone === 'string' ? req.query.phone : '';
  if (phone.replace(/\D/g, '').length >= 7 && phoneHash(phone) === referral.ownerHash) {
    return res.status(400).json({ error: 'No puedes usar tu propio código' });
  }

  res.json(responseFor(referral));
});

router.post('/:code/convert', (req, res) => {
  const code = normalizeCode(req.params.code);
  const phone = typeof req.body?.phone === 'string' ? req.body.phone : '';
  const normalizedPhone = phone.replace(/\D/g, '');
  if (!isValidCode(code) || normalizedPhone.length < 7) {
    return res.status(400).json({ error: 'Código y teléfono válidos son requeridos' });
  }

  const referral = referrals.get(code);
  if (!referral) {
    return res.status(404).json({ error: 'Código de referido no encontrado' });
  }

  const guestHash = phoneHash(phone);
  if (guestHash === referral.ownerHash) {
    return res.status(400).json({ error: 'No puedes usar tu propio código' });
  }
  if (referral.bookings.has(guestHash)) {
    return res.status(409).json({ error: 'Este teléfono ya usó el código' });
  }

  referral.bookings.add(guestHash);
  res.status(201).json(responseFor(referral));
});

module.exports = router;
