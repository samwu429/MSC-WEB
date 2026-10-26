import type { PageContext } from '../../context';
import { Icon, type IconName } from '../../components/Icon';
import { Bi, BiText, SectionHeading, type Copy } from '../../components/common';
import { COMMON, t } from '../../i18n/strings';
import { HOME } from '../strings';

function AccessCard(props: { icon: IconName; title: Copy; text: Copy; href: string; action: string; actionIcon: IconName; primary?: boolean }) {
  return (
    <article class="card">
      <div class="card__body">
        <div class="pillar__icon">
          <Icon name={props.icon} />
        </div>
        <h3 class="card__title">
          <Bi text={props.title} />
        </h3>
        <BiText text={props.text} class="pillar__text" />
        <div class="btn-row">
          <a class={`btn ${props.primary ? 'btn--primary' : 'btn--ghost'}`} href={props.href}>
            <Icon name={props.actionIcon} />
            {props.action}
          </a>
        </div>
      </div>
    </article>
  );
}

/**
 * The way into the member network and the Android download, which the holding page used to offer before this site
 * replaced it, including the iPhone "Add to Home Screen" instructions.
 * 成员网络入口与安卓下载。在本网站取代原来的占位页之前，这些内容由占位页提供，其中包括 iPhone "添加到主屏幕" 的说明。
 */
export function MemberAppSection({ ctx }: { ctx: PageContext }) {
  const { locale, links } = ctx;
  return (
    <section class="section section--alt" aria-labelledby="home-member-app">
      <div class="container">
        <SectionHeading
          id="home-member-app"
          eyebrow={t(HOME, 'memberAppEyebrow', locale)}
          title={HOME.memberAppTitle}
          lead={HOME.memberAppLead}
        />
        <div class="grid grid--2">
          <AccessCard
            icon="globe"
            title={HOME.memberAppWebTitle}
            text={HOME.memberAppWebText}
            href={links.memberApp}
            action={t(COMMON, 'openMemberNetwork', locale)}
            actionIcon="arrow"
            primary
          />
          <AccessCard
            icon="phone"
            title={HOME.memberAppAndroidTitle}
            text={HOME.memberAppAndroidText}
            href={links.android}
            action={t(COMMON, 'downloadAndroid', locale)}
            actionIcon="download"
          />
        </div>
      </div>
    </section>
  );
}
