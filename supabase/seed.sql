-- ============================================================
--  SETU — seed demo cases (run AFTER schema.sql, once)
--  Gives the doctor/hub/onboarding screens real rows to work with.
-- ============================================================

-- Meena R. — doctor queue (mild male factor)
with p as (
  insert into patients (name, age, partner_age, bmi, location, married, complaint, clinic)
  values ('Meena R.', 31, 34, '23.0 · normal', 'Nadiad, GJ · Tier 3', '4 yrs', 'Primary infertility, 3 yrs', 'Shreeji · Nadiad')
  returning id
)
insert into cases (patient_id, status, evidence)
select p.id, 'doctor', jsonb_build_object(
  'records', jsonb_build_object(
    'labs', jsonb_build_array(
      jsonb_build_object('name','AMH','value','2.4','unit','ng/mL','ref','1-4','flag',0),
      jsonb_build_object('name','FSH','value','6.1','unit','mIU/mL','ref','3-10','flag',0),
      jsonb_build_object('name','AFC','value','14','unit','foll','ref','8-24','flag',0),
      jsonb_build_object('name','Sperm concentration','value','48','unit','M/mL','ref','>=16','flag',0),
      jsonb_build_object('name','Sperm motility','value','55','unit','%','ref','>=42','flag',0),
      jsonb_build_object('name','Morphology','value','6','unit','%','ref','>=4','flag',1)
    ),
    'hsg', 'Bilateral tubal patency confirmed'
  ),
  'history', jsonb_build_object('infertility','Primary · 3 yrs','cycles','Regular, 28-30d','tb','None','priorTreatment','2x ovulation induction, failed')
) from p;

-- Kavita S. — reception/intake, incomplete (PCOS, missing tests)
with p as (
  insert into patients (name, age, partner_age, bmi, location, married, complaint, clinic)
  values ('Kavita S.', 29, 32, '27.6 · high', 'Anand, GJ · Tier 3', '3 yrs', 'Primary infertility, 2 yrs', 'Aastha · Anand')
  returning id
)
insert into cases (patient_id, status, evidence)
select p.id, 'doctor', jsonb_build_object(
  'records', jsonb_build_object(
    'labs', jsonb_build_array(
      jsonb_build_object('name','TSH','value','3.1','unit','uIU/mL','ref','0.4-4','flag',0),
      jsonb_build_object('name','Sperm concentration','value','52','unit','M/mL','ref','>=16','flag',0)
    ),
    'hsg', 'Not done'
  ),
  'history', jsonb_build_object('infertility','Primary · 2 yrs','cycles','Irregular, 40-60d','pcos','suspected','tb','None')
) from p;

-- Rekha M. — hub approval queue (low AMH)
with p as (
  insert into patients (name, age, partner_age, bmi, location, married, complaint, clinic)
  values ('Rekha M.', 39, 41, '22 · normal', 'Palanpur, GJ · Tier 2', '6 yrs', 'Primary infertility, 5 yrs', 'Sanjeevani · Palanpur')
  returning id
)
insert into cases (patient_id, status, evidence, ai_verdict, doctor_note, locus, referral)
select p.id, 'hub_review',
  jsonb_build_object(
    'records', jsonb_build_object(
      'labs', jsonb_build_array(
        jsonb_build_object('name','AMH','value','0.7','unit','ng/mL','ref','LOW','flag',1),
        jsonb_build_object('name','AFC','value','4','unit','foll','ref','LOW','flag',1),
        jsonb_build_object('name','Sperm concentration','value','44','unit','M/mL','ref','>=16','flag',0)
      ),
      'hsg', 'Bilateral tubal patency confirmed'),
    'history', jsonb_build_object('infertility','Primary · 5 yrs','cycles','Regular','tb','None'),
    'conversation', jsonb_build_object('findings', jsonb_build_array('5 yrs primary','Regular cycles'))),
  jsonb_build_object('diagnosis','Diminished ovarian reserve (AMH 0.7, AFC 4, age 39) — time-critical.',
    'locus','hub','referral','IVF (expedite) ± donor egg','redFlags', jsonb_build_array('Low AMH','Age ≥ 40 approaching')),
  'Age 39, AMH 0.7, AFC 4 — clearly diminished reserve. Expedite.',
  'hub', 'IVF (expedite) ± donor egg'
from p;

-- Anjali T. — onboarding (male factor, already approved)
with p as (
  insert into patients (name, age, partner_age, bmi, location, married, complaint, clinic)
  values ('Anjali T.', 30, 33, '24 · normal', 'Nadiad, GJ · Tier 3', '4 yrs', 'Primary infertility, 3 yrs', 'Shreeji · Nadiad')
  returning id
)
insert into cases (patient_id, status, evidence, ai_verdict, doctor_note, specialist_note, locus, referral, onboarding)
select p.id, 'onboarding',
  jsonb_build_object(
    'records', jsonb_build_object(
      'labs', jsonb_build_array(
        jsonb_build_object('name','AMH','value','2.2','unit','ng/mL','ref','1-4','flag',0),
        jsonb_build_object('name','Sperm concentration','value','9','unit','M/mL','ref','LOW','flag',1),
        jsonb_build_object('name','Sperm motility','value','30','unit','%','ref','LOW','flag',1)),
      'hsg', 'Bilateral tubal patency confirmed'),
    'history', jsonb_build_object('infertility','Primary · 3 yrs','priorTreatment','1x IUI, failed'),
    'conversation', jsonb_build_object('findings', jsonb_build_array('3 yrs primary','1 failed IUI'))),
  jsonb_build_object('diagnosis','Male factor (oligoasthenospermia); normal reserve, patent tubes.',
    'locus','hub','referral','IVF-ICSI'),
  'Mild-moderate male factor, 1 failed IUI. -> IVF-ICSI.',
  'Confirmed - proceed with IVF-ICSI.',
  'hub', 'IVF-ICSI',
  '{"checklist":[true,true,false,false,false]}'::jsonb
from p;
