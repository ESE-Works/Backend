import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('contracts')
export class Contract {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  user_id!: string | null;

  @Column({ type: 'varchar', default: 'PENDING' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  original_text!: string | null;

  @Column({ type: 'json', nullable: true })
  analysis_result!: object | null;

  @Column({ type: 'varchar', nullable: true })
  input_source!: string | null;

  @CreateDateColumn()
  created_at!: Date;
}
