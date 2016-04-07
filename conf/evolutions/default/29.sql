# --- !Ups

ALTER TABLE `lir_backoffice`.`stories_labels`
  DROP FOREIGN KEY `fk_stories_labels_stories_01`,
  DROP FOREIGN KEY `fk_stories_labels_labels_02`;
  ALTER TABLE `lir_backoffice`.`stories_labels`
  CHANGE COLUMN `story_id` `story_id` BIGINT(20) NULL ,
  CHANGE COLUMN `label_id` `label_id` BIGINT(20) NULL ,
  ADD COLUMN `id` BIGINT(20) NOT NULL AUTO_INCREMENT FIRST,
  DROP PRIMARY KEY,
  ADD PRIMARY KEY (`id`),
  DROP INDEX `fk_stories_labels_labels_02` ;


# --- !Downs

ALTER TABLE `lir_backoffice`.`stories_labels`
DROP COLUMN `id`,
CHANGE COLUMN `story_id` `story_id` BIGINT(20) NOT NULL ,
CHANGE COLUMN `label_id` `label_id` BIGINT(20) NOT NULL ,
DROP PRIMARY KEY,
ADD PRIMARY KEY (`story_id`, `label_id`);
ALTER TABLE `lir_backoffice`.`stories_labels`
ADD CONSTRAINT `fk_stories_labels_stories_01`
  FOREIGN KEY (`story_id`)
  REFERENCES `lir_backoffice`.`stories` (`id`)
  ON DELETE RESTRICT
  ON UPDATE RESTRICT,
ADD CONSTRAINT `fk_stories_labels_labels_02`
  FOREIGN KEY (`label_id`)
  REFERENCES `lir_backoffice`.`labels` (`id`)
  ON DELETE RESTRICT
  ON UPDATE RESTRICT;

ALTER TABLE `lir_backoffice`.`stories_labels`
DROP COLUMN `version`;
