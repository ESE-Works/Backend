import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TermType } from '../term-type.enum';

/**
 * 약관/동의 항목의 특정 버전. 개정될 때마다 새 버전을 추가하고 기존 버전은 남겨둔다
 * (이미 동의한 유저의 이력이 어떤 내용에 동의했는지 그대로 보존되어야 하므로 수정하지 않는다).
 */
@Entity('terms')
export class Term {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: TermType })
  type!: TermType;

  @Column()
  version!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  content!: string;

  @Column({ default: true })
  is_required!: boolean;

  @Column({ type: 'date' })
  effective_date!: string;

  @CreateDateColumn()
  created_at!: Date;
}
