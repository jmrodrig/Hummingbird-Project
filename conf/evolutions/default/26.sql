# --- !Ups


CREATE TABLE `lir_backoffice`.`users_followers` (
  `user_id` VARCHAR(255) NOT NULL,
  `following_user_id` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`user_id`, `following_user_id`));

CREATE TABLE `lir_backoffice`.`collections_followers` (
  `user_id` VARCHAR(255) NOT NULL,
  `collection_id` BIGINT(20) NOT NULL,
  PRIMARY KEY (`user_id`, `collection_id`));



# --- !Downs


DROP TABLE `lir_backoffice`.`collections_followers`;

DROP TABLE `lir_backoffice`.`users_followers`;
