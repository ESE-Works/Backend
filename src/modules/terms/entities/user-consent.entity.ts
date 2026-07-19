import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TermType } from '../term-type.enum';

/**
 * 유저가 특정 버전의 약관에 동의(또는 거부)한 이력. 절대 덮어쓰지 않고 매번 새로 추가한다
 * (분쟁 시 "그 시점에 어떤 약관에 동의했는지"를 그대로 증명할 수 있어야 하므로).
 */
@Entity('user_consents')
export class UserConsent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  user_id!: string;

  @Column({ type: 'uuid' })
  term_id!: string;

  @Column({ type: 'enum', enum: TermType })
  term_type!: TermType;

  @Column()
  term_version!: string;

  @Column()
  agreed!: boolean;

  @Column({ type: 'varchar', nullable: true })
  ip_address!: string | null;

  @CreateDateColumn()
  agreed_at!: Date;
}
