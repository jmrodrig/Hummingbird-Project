# --- !Ups

create table invitations (
  id                        bigint auto_increment not null,
  email                     varchar(255),
  award_points              double,
  user_id                   varchar(255),
  version                   bigint not null,
  constraint pk_invitations primary key (id))
;

create table labels (
  id                        bigint auto_increment not null,
  name                      varchar(255),
  version                   bigint not null,
  constraint pk_labels primary key (id))
;

create table stories (
  id                        bigint auto_increment not null,
  title                     varchar(255),
  summary                   varchar(255),
  cost                      double,
  path                      varchar(255),
  version                   bigint not null,
  constraint pk_stories primary key (id))
;

create table users (
  id                        varchar(255) not null,
  provider                  varchar(255),
  firstName                 varchar(255),
  lastName                  varchar(255),
  fullName                  varchar(255),
  email                     varchar(255),
  avatarUrl                 varchar(255),
  password                  varchar(255),
  version                   bigint not null,
  constraint pk_users primary key (id))
;

create table users_stories (
  id                        bigint auto_increment not null,
  is_author                 tinyint(1) default 0,
  is_owner                  tinyint(1) default 0,
  rating                    integer,
  comment                   varchar(255),
  user_id                   varchar(255),
  story_id                  bigint,
  version                   bigint not null,
  constraint pk_users_stories primary key (id))
;


create table stories_labels (
  story_id                       bigint not null,
  label_id                       bigint not null,
  constraint pk_stories_labels primary key (story_id, label_id))
;
alter table invitations add constraint fk_invitations_user_1 foreign key (user_id) references users (id) on delete restrict on update restrict;
create index ix_invitations_user_1 on invitations (user_id);
alter table users_stories add constraint fk_users_stories_user_2 foreign key (user_id) references users (id) on delete restrict on update restrict;
create index ix_users_stories_user_2 on users_stories (user_id);
alter table users_stories add constraint fk_users_stories_story_3 foreign key (story_id) references stories (id) on delete restrict on update restrict;
create index ix_users_stories_story_3 on users_stories (story_id);



alter table stories_labels add constraint fk_stories_labels_stories_01 foreign key (story_id) references stories (id) on delete restrict on update restrict;

alter table stories_labels add constraint fk_stories_labels_labels_02 foreign key (label_id) references labels (id) on delete restrict on update restrict;

# --- !Downs

SET FOREIGN_KEY_CHECKS=0;

drop table invitations;

drop table labels;

drop table stories_labels;

drop table stories;

drop table users;

drop table users_stories;

SET FOREIGN_KEY_CHECKS=1;

