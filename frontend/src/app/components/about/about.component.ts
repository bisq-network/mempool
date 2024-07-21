import { ChangeDetectionStrategy, Component, ElementRef, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import { StateService } from '../../services/state.service';
import { Observable } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { Router, ActivatedRoute } from '@angular/router';
import { map, share, tap } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent implements OnInit {
  @ViewChild('promoVideo') promoVideo: ElementRef;
  frontendGitCommitHash = this.stateService.env.GIT_COMMIT_HASH;
  packetJsonVersion = this.stateService.env.PACKAGE_JSON_VERSION;

  constructor(
    public stateService: StateService,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    @Inject(LOCALE_ID) public locale: string,
    @Inject(DOCUMENT) private document: Document,
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit() {
  }

  showSubtitles(language): boolean {
    return ( this.locale.startsWith( language ) && !this.locale.startsWith('en') );
  }

}
