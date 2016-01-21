# --- !Ups

CREATE TABLE `lir_backoffice`.`savedstories` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT,
  `story_id` BIGINT(20) NOT NULL,
  `user_id` VARCHAR(255) NOT NULL,
  `date` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `version` INT(11) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `story_fk_idx` (`story_id` ASC),
  INDEX `user_fk_idx` (`user_id` ASC),
  CONSTRAINT `story_fk`
    FOREIGN KEY (`story_id`)
    REFERENCES `lir_backoffice`.`stories` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `user_fk`
    FOREIGN KEY (`user_id`)
    REFERENCES `lir_backoffice`.`users` (`id`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION);


# --- !Downs

DROP TABLE `lir_backoffice`.`savedstories`;
