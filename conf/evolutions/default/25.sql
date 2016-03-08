# --- !Ups


ALTER TABLE `lir_backoffice`.`stories_story_collections`
ADD COLUMN `previous_story_id` BIGINT(20) NULL DEFAULT '-1' AFTER `collection_id`,
ADD COLUMN `next_story_id` BIGINT(20) NULL DEFAULT '-1' AFTER `previous_story_id`,
ADD COLUMN `version` INT(11) NOT NULL AFTER `next_story_id`;

ALTER TABLE `lir_backoffice`.`story_collections`
ADD COLUMN `published` TINYINT(1) NULL DEFAULT 0 AFTER `imageUrl`;



# --- !Downs

ALTER TABLE `lir_backoffice`.`stories`
DROP COLUMN `previous_story_id` ,
DROP COLUMN `next_story_id` ,
DROP COLUMN `version` ;

ALTER TABLE `lir_backoffice`.`story_collections`
DROP COLUMN `published`;
