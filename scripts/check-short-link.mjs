#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const shortCode = process.argv[2] || process.env.SHORT_CODE;
if (!shortCode) {
  console.error('Usage: node scripts/check-short-link.mjs <SHORT_CODE>');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

console.log(`🔎 Checking guidance_token and sms_tracking for short_code=${shortCode} ...`);

try {
  const { data: tokenRow, error: tokenErr } = await supabase
    .from('guidance_token')
    .select('*')
    .eq('short_code', shortCode)
    .maybeSingle();

  if (tokenErr) {
    console.error('❌ guidance_token query error:', tokenErr.message || tokenErr);
  }

  if (!tokenRow) {
    console.log('❌ No guidance_token row found for this short_code');
    process.exit(2);
  }

  console.log('✅ guidance_token row:', {
    user_id: tokenRow.user_id,
    date: tokenRow.date,
    expires_at: tokenRow.expires_at,
    short_code: tokenRow.short_code,
    token: tokenRow.token?.slice(0, 8) + '...'
  });

  const { data: trackingRows, error: trackErr } = await supabase
    .from('sms_tracking')
    .select('*')
    .eq('short_code', shortCode)
    .eq('token', tokenRow.token);

  if (trackErr) {
    console.error('❌ sms_tracking query error:', trackErr.message || trackErr);
  }

  console.log(`ℹ️ sms_tracking rows found: ${trackingRows ? trackingRows.length : 0}`);

  const { data: guidanceRow, error: guidErr } = await supabase
    .from('daily_guidance')
    .select('user_id, date')
    .eq('user_id', tokenRow.user_id)
    .eq('date', tokenRow.date)
    .maybeSingle();

  if (guidErr) {
    console.error('❌ daily_guidance query error:', guidErr.message || guidErr);
  }

  console.log('ℹ️ daily_guidance present:', !!guidanceRow);

  const expired = new Date(tokenRow.expires_at) < new Date();
  console.log('⌛ expired:', expired);

  if (!expired) {
    console.log('🎯 Everything looks consistent for this short code.');
  } else {
    console.log('⚠️ The token is expired. Generate and test a fresh link.');
  }
  process.exit(0);
} catch (e) {
  console.error('❌ Unexpected error:', e);
  process.exit(3);
}


