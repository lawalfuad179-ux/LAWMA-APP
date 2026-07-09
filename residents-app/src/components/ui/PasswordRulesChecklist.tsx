'use client';

import { Check } from 'lucide-react';
import { passwordRules } from '@/lib/validators/validation';
import styles from './PasswordRulesChecklist.module.css';

type Props = {
  password: string;
};

export function PasswordRulesChecklist({ password }: Props) {
  if (!password) return null;

  return (
    <div className={styles.rules} role="list" aria-label="Password requirements">
      {passwordRules.map((rule) => {
        const isMet = rule.test(password);
        return (
          <span
            key={rule.key}
            className={`${styles.ruleItem} ${isMet ? styles.ruleMet : ''}`}
            role="listitem"
            aria-label={`${rule.label}: ${isMet ? 'met' : 'not met'}`}
          >
            <Check
              size={12}
              strokeWidth={2}
              className={isMet ? styles.checkIconMet : styles.checkIcon}
            />
            {rule.label}
          </span>
        );
      })}
    </div>
  );
}
