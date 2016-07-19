# --- !Ups

ALTER TABLE `lir_backoffice`.`locations`
  ADD COLUMN `story_id` BIGINT(20) NULL AFTER `showpin`,
  ADD COLUMN `model_version` TINYINT(1) NULL AFTER `story_id`;

# --- !Downs

ALTER TABLE `lir_backoffice`.`locations`
  DROP COLUMN `model_version` ,
  DROP COLUMN `story_id` ;
