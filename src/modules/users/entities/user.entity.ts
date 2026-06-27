import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nickname: string;

  @Column({ nullable: true })
  profile_image_url: string;

  @Column()
  provider: string;

  @Column()
  provider_id: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  income_range: string;

  @CreateDateColumn()
  created_at: Date;
}
